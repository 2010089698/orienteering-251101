interface EntryClassProps {
  readonly id: string;
  readonly name: string;
  readonly capacity?: number;
}

class EntryClass {
  private constructor(
    private readonly classId: string,
    private readonly displayName: string,
    private readonly maxCapacity?: number
  ) {}

  public static create(props: EntryClassProps): EntryClass {
    const id = props.id?.trim();
    if (!id) {
      throw new Error('エントリークラスIDを指定してください。');
    }

    const name = props.name?.trim();
    if (!name) {
      throw new Error('エントリークラス名を指定してください。');
    }

    if (props.capacity !== undefined && props.capacity !== null) {
      if (!Number.isInteger(props.capacity) || props.capacity <= 0) {
        throw new Error('エントリークラスの定員は1以上の整数で指定してください。');
      }
    }

    return new EntryClass(id, name, props.capacity ?? undefined);
  }

  public get identifier(): string {
    return this.classId;
  }

  public get title(): string {
    return this.displayName;
  }

  public get capacity(): number | undefined {
    return this.maxCapacity;
  }
}

export type { EntryClassProps };
export default EntryClass;
