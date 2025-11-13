interface ParticipantProfileProps {
  readonly fullName: string;
  readonly email: string;
}

class ParticipantProfile {
  private constructor(
    private readonly name: string,
    private readonly emailAddress: string
  ) {}

  public static create(props: ParticipantProfileProps): ParticipantProfile {
    const trimmedName = props.fullName?.trim();
    if (!trimmedName) {
      throw new Error('参加者氏名を入力してください。');
    }

    const trimmedEmail = props.email?.trim();
    if (!trimmedEmail) {
      throw new Error('連絡先メールアドレスを入力してください。');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      throw new Error('メールアドレスの形式が正しくありません。');
    }

    return new ParticipantProfile(trimmedName, trimmedEmail.toLowerCase());
  }

  public get fullName(): string {
    return this.name;
  }

  public get email(): string {
    return this.emailAddress;
  }
}

export type { ParticipantProfileProps };
export default ParticipantProfile;
