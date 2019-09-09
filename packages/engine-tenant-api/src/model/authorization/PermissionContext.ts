import { Identity } from '@contember/engine-common'
import { AuthorizationScope, Authorizator } from '@contember/authorization'
import { ForbiddenError } from 'apollo-server-errors'

export class PermissionContext {
	constructor(public readonly identity: Identity, public readonly authorizator: Authorizator<Identity>) {}

	public async isAllowed({
		scope,
		action,
	}: {
		scope?: AuthorizationScope<Identity>
		action: Authorizator.Action
	}): Promise<boolean> {
		return await this.authorizator.isAllowed(this.identity, scope || new AuthorizationScope.Global(), action)
	}

	public async requireAccess({
		scope,
		action,
		message,
	}: {
		scope?: AuthorizationScope<Identity>
		action: Authorizator.Action
		message?: string
	}): Promise<void> {
		if (!(await this.isAllowed({ scope, action }))) {
			throw new ForbiddenError(message || 'Forbidden')
		}
	}
}