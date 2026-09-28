export const adminEmail = "ramosraf278@gmail.com";

export function isLedgerAdmin(user) {
  return user?.email?.trim().toLocaleLowerCase() === adminEmail;
}
