import { testMigrations } from '../../src/tests'
import { createSchema, SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { SQL } from '../../src/tags'
import { SchemaDefinition as def } from '@contember/schema-definition'

testMigrations('remove an entity', {
	original: {
		model: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.entity('Post', e =>
				e
					.column('title', c => c.type(Model.ColumnType.String))
					.manyHasOne('author', r => r.target('Author').onDelete(Model.OnDelete.cascade)),
			)
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'removeEntity',
			entityName: 'Author',
		},
	],
	sql: SQL`ALTER TABLE "post" DROP "author_id"; DROP TABLE "author";`,
})

testMigrations('remove entity with acl', {
	original: {
		model: new SchemaBuilder()
			.entity('Site', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
			.entity('Post', entity => entity.column('title').manyHasOne('site', r => r.target('Site')))
			.buildSchema(),
		acl: {
			roles: {
				admin: {
					variables: {
						siteId: {
							type: Acl.VariableType.entity,
							entityName: 'Site',
						},
					},
					stages: '*',
					entities: {
						Site: {
							predicates: {},
							operations: {
								read: {
									id: true,
								},
							},
						},
						Post: {
							predicates: {
								site: { site: { id: 'siteId' } },
							},
							operations: {
								read: {
									title: 'site',
								},
							},
						},
					},
				},
			},
		},
	},
	updated: {
		model: new SchemaBuilder().entity('Post', entity => entity.column('title')).buildSchema(),
		acl: {
			roles: {
				admin: {
					variables: {},
					stages: '*',
					entities: {
						Post: {
							predicates: {
								site: {},
							},
							operations: {
								read: {
									title: 'site',
								},
							},
						},
					},
				},
			},
		},
	},
	diff: [
		{
			modification: 'removeEntity',
			entityName: 'Site',
		},
	],
	sql: SQL`ALTER TABLE "post" DROP "site_id"; DROP TABLE "site";`,
})

namespace ViewEntityOriginalSchema {
	@def.View("SELECT null as id, 'John' AS name")
	export class Author {
		name = def.stringColumn()
	}
}
testMigrations('remove a view', {
	original: createSchema(ViewEntityOriginalSchema),
	updated: {},
	diff: [
		{
			modification: 'removeEntity',
			entityName: 'Author',
		},
	],
	sql: SQL`
	DROP VIEW "author";`,
})
