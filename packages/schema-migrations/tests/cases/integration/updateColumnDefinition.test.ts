import { testMigrations } from '../../src/tests'
import { SchemaBuilder, SchemaDefinition as def, createSchema } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'
import { updateColumnDefinitionModification } from '../../../src'

testMigrations('update column definition', {
	original: {
		model: new SchemaBuilder()
			.entity('Author', e =>
				e.column('name', c => c.type(Model.ColumnType.String)).column('registeredAt', c => c.type(Model.ColumnType.Date)),
			)
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Author', e =>
				e
					.column('name', c => c.type(Model.ColumnType.String))
					.column('registeredAt', c => c.type(Model.ColumnType.DateTime)),
			)
			.buildSchema(),
	},
	diff: [
		{
			modification: 'updateColumnDefinition',
			entityName: 'Author',
			fieldName: 'registeredAt',
			definition: {
				type: Model.ColumnType.DateTime,
				columnType: 'timestamptz',
				nullable: true,
			},
		},
	],
	sql: SQL`ALTER TABLE "author"
		ALTER "registered_at" SET DATA TYPE timestamptz USING "registered_at"::timestamptz;`,
})

namespace SeqOrig {
	export class Author {
		idSeq = def.intColumn()
	}
}
namespace SeqUpdated {
	export class Author {
		idSeq = def.intColumn().notNull().sequence({ start: 10 })
	}
}
testMigrations('add sequence to existing column', {
	original: createSchema(SeqOrig),
	updated: createSchema(SeqUpdated),
	diff: [
		updateColumnDefinitionModification.createModification({
			entityName: 'Author',
			fieldName: 'idSeq',
			definition: {
				type: Model.ColumnType.Int,
				columnType: 'integer',
				nullable: false,
				sequence: {
					precedence: 'BY DEFAULT',
					start: 10,
				},
			},
		}),
	],
	sql: SQL`
ALTER TABLE "author"
		ALTER "id_seq" SET DATA TYPE integer USING COALESCE("id_seq"::integer, nextval(PG_GET_SERIAL_SEQUENCE($pga$author$pga$, $pga$id_seq$pga$))),
		ALTER "id_seq" SET NOT NULL,
		ALTER "id_seq" ADD GENERATED BY DEFAULT AS IDENTITY (START WITH 10);`,
})


namespace ViewColDepOrig {
	export class Author {
		val = def.intColumn()
	}

	@def.View('SELECT * FROM author', {
		dependencies: [Author],
	})
	export class AuthorMetaX {

	}

	@def.View('SELECT * FROM author_meta_x', {
		dependencies: [AuthorMetaX],
	})
	export class AuthorMetaY {
	}
}

namespace ViewColDepUpdated {
	export class Author {
		val = def.stringColumn()
	}

	@def.View('SELECT * FROM author', {
		dependencies: [Author],
	})
	export class AuthorMetaX {

	}

	@def.View('SELECT * FROM author_meta_x', {
		dependencies: [AuthorMetaX],
	})
	export class AuthorMetaY {
	}
}

testMigrations('recreate view dependent on entity after changing column type', {
	original: createSchema(ViewColDepOrig),
	updated: createSchema(ViewColDepUpdated),
	diff: [{ modification: 'removeEntity', entityName: 'AuthorMetaY' }, {
		modification: 'removeEntity',
		entityName: 'AuthorMetaX',
	}, {
		modification: 'updateColumnDefinition',
		entityName: 'Author',
		fieldName: 'val',
		definition: { nullable: true, type: 'String', columnType: 'text' },
	}, {
		modification: 'createView',
		entity: {
			name: 'AuthorMetaX',
			primary: 'id',
			primaryColumn: 'id',
			unique: [],
			indexes: [],
			fields: {
				id: {
					name: 'id',
					columnName: 'id',
					nullable: false,
					type: 'Uuid',
					columnType: 'uuid',
				},
			},
			tableName: 'author_meta_x',
			eventLog: { enabled: true },
			view: { sql: 'SELECT * FROM author', dependencies: ['Author'] },
		},
	}, {
		modification: 'createView',
		entity: {
			name: 'AuthorMetaY',
			primary: 'id',
			primaryColumn: 'id',
			unique: [],
			indexes: [],
			fields: {
				id: {
					name: 'id',
					columnName: 'id',
					nullable: false,
					type: 'Uuid',
					columnType: 'uuid',
				},
			},
			tableName: 'author_meta_y',
			eventLog: { enabled: true },
			view: { sql: 'SELECT * FROM author_meta_x', dependencies: ['AuthorMetaX'] },
		},
	}],
	sql: SQL`DROP VIEW "author_meta_y";
DROP VIEW "author_meta_x";
ALTER TABLE "author"
  ALTER "val" SET DATA TYPE text USING "val"::text;
CREATE VIEW "author_meta_x" AS SELECT * FROM author;
CREATE VIEW "author_meta_y" AS SELECT * FROM author_meta_x;`,
})


namespace NotNullOrig {
	export class Author {
		name = def.stringColumn()
	}
}
namespace NotNullUpdated {
	export class Author {
		name = def.stringColumn().notNull()
	}
}
testMigrations('set not null and fill', {
	original: createSchema(NotNullOrig),
	updated: createSchema(NotNullUpdated),
	noDiff: true,
	diff: [
		updateColumnDefinitionModification.createModification({
			entityName: 'Author',
			fieldName: 'name',
			definition: {
				type: Model.ColumnType.String,
				columnType: 'text',
				nullable: false,
			},
			fillValue: 'unnamed',
		}),
	],
	sql: SQL`
UPDATE "author" SET "name" = $pga$unnamed$pga$ WHERE "name" IS NULL;
SET CONSTRAINTS ALL IMMEDIATE; SET CONSTRAINTS ALL DEFERRED;
ALTER TABLE "author" ALTER "name" SET NOT NULL;`,
})
