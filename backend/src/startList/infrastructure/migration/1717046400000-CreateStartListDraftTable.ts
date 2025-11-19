import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateStartListDraftTable1717046400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'start_lists',
        columns: [
          { name: 'event_id', type: 'text', isPrimary: true },
          { name: 'race_id', type: 'text', isPrimary: true },
          { name: 'start_at', type: 'datetime', isNullable: false },
          { name: 'interval_seconds', type: 'integer', isNullable: false },
          { name: 'lane_count', type: 'integer', isNullable: false },
          { name: 'lane_assignments', type: 'text', isNullable: false, default: "'[]'" },
          { name: 'participant_slots', type: 'text', isNullable: false, default: "'[]'" },
          { name: 'is_finalized', type: 'boolean', isNullable: false, default: 0 },
          { name: 'updated_at', type: 'datetime', isNullable: false },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('start_lists');
  }
}
