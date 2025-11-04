import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateEntryReceptionTables1728000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'entry_receptions',
        columns: [
          { name: 'event_id', type: 'text', isPrimary: true },
          { name: 'race_id', type: 'text', isPrimary: true },
          { name: 'reception_start', type: 'datetime', isNullable: false },
          { name: 'reception_end', type: 'datetime', isNullable: false },
        ],
      })
    );

    await queryRunner.createForeignKey(
      'entry_receptions',
      new TableForeignKey({
        columnNames: ['event_id'],
        referencedTableName: 'events',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'entry_reception_classes',
        columns: [
          { name: 'event_id', type: 'text', isPrimary: true },
          { name: 'race_id', type: 'text', isPrimary: true },
          { name: 'class_id', type: 'text', isPrimary: true },
          { name: 'name', type: 'text', isNullable: false },
          { name: 'capacity', type: 'integer', isNullable: true },
        ],
      })
    );

    await queryRunner.createForeignKey(
      'entry_reception_classes',
      new TableForeignKey({
        columnNames: ['event_id', 'race_id'],
        referencedTableName: 'entry_receptions',
        referencedColumnNames: ['event_id', 'race_id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const classTable = await queryRunner.getTable('entry_reception_classes');
    if (classTable) {
      for (const foreignKey of classTable.foreignKeys) {
        await queryRunner.dropForeignKey('entry_reception_classes', foreignKey);
      }
    }
    await queryRunner.dropTable('entry_reception_classes', true);

    const receptionTable = await queryRunner.getTable('entry_receptions');
    if (receptionTable) {
      for (const foreignKey of receptionTable.foreignKeys) {
        await queryRunner.dropForeignKey('entry_receptions', foreignKey);
      }
    }
    await queryRunner.dropTable('entry_receptions', true);
  }
}

export default CreateEntryReceptionTables1728000000000;
