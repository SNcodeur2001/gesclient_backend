export class ClientAlreadyExistsException extends Error {
  constructor(email: string) {
    super(`Email ${email} déjà utilisé`);
    this.name = 'ClientAlreadyExistsException';
  }
}