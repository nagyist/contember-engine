import { Schema } from '@contember/schema'
import { ProjectConfig } from '../types'

export interface SystemMigrationArgs {
	schemaResolver: () => Promise<Schema>
	project: ProjectConfig
}