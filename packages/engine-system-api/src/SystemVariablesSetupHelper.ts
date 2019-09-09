import { Client } from '@contember/database'
import { UuidProvider } from './utils/uuid'

export const unnamedIdentity = '11111111-1111-1111-1111-111111111111'

export async function setupSystemVariables(db: Client, identityId: string, providers: UuidProvider) {
	await Promise.all([
		await db.query('SELECT set_config(?, ?, false)', [
			'tenant.identity_id', // todo rename to system.identity_id
			identityId,
		]),
		await db.query('SELECT set_config(?, ?, false)', ['system.transaction_id', providers.uuid()]),
	])
}