import { ApiKeyManager } from './apiKey'
import { IdentityProviderBySlugQuery, PersonQuery, PersonRow } from '../queries'
import { IDPHandlerRegistry, IDPResponse, IDPResponseError, IDPValidationError } from './idp'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { InitSignInIdpErrorCode, SignInIdpErrorCode } from '../../schema'
import { DatabaseContext } from '../utils'

class IDPSignInManager {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly idpRegistry: IDPHandlerRegistry,
	) {}

	async signInIDP(
		dbContext: DatabaseContext,
		idpSlug: string,
		redirectUrl: string,
		idpResponse: IDPResponse,
		sessionData: any,
		expiration?: number,
	): Promise<IDPSignInManager.SignInIDPResponse> {
		const provider = await dbContext.queryHandler.fetch(new IdentityProviderBySlugQuery(idpSlug))
		if (!provider || provider.disabledAt) {
			throw new Error('provider not found')
		}
		try {
			const providerService = this.idpRegistry.getHandler(provider.type)
			const validatedConfig = providerService.validateConfiguration(provider.configuration)
			const claim = await providerService.processResponse(
				validatedConfig,
				redirectUrl,
				idpResponse,
				sessionData,
			)
			const personRow = await dbContext.queryHandler.fetch(PersonQuery.byEmail(claim.email))
			if (!personRow) {
				return new ResponseError(SignInIdpErrorCode.PersonNotFound, `Person ${claim.email} not found`)
			}

			const sessionToken = await this.apiKeyManager.createSessionApiKey(dbContext, personRow.identity_id, expiration)
			return new ResponseOk({ person: personRow, token: sessionToken })
		} catch (e) {
			if (e instanceof IDPResponseError) {
				return new ResponseError(SignInIdpErrorCode.InvalidIdpResponse, e.message)
			}
			if (e instanceof IDPValidationError) {
				return new ResponseError(SignInIdpErrorCode.IdpValidationFailed, e.message)
			}
			throw e
		}
	}

	async initSignInIDP(dbContext: DatabaseContext, idpSlug: string, redirectUrl: string): Promise<IDPSignInManager.InitSignInIDPResponse> {
		const provider = await dbContext.queryHandler.fetch(new IdentityProviderBySlugQuery(idpSlug))
		if (!provider || provider.disabledAt) {
			return new ResponseError(InitSignInIdpErrorCode.ProviderNotFound, `Identity provider ${idpSlug} not found`)
		}
		const providerService = this.idpRegistry.getHandler(provider.type)
		const validatedConfig = providerService.validateConfiguration(provider.configuration)
		const initResponse = await providerService.initAuth(validatedConfig, redirectUrl)
		return new ResponseOk(initResponse)
	}
}

namespace IDPSignInManager {
	export interface InitSignInIDPResult {
		readonly authUrl: string
		readonly sessionData: any
	}

	export type InitSignInIDPResponse = Response<InitSignInIDPResult, InitSignInIdpErrorCode>

	interface SignInIDPResult {
		readonly person: PersonRow
		readonly token: string
	}

	export type SignInIDPResponse = Response<SignInIDPResult, SignInIdpErrorCode>
}

export { IDPSignInManager }
