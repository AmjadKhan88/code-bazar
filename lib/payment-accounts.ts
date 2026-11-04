export interface ManualPaymentAccount {
  id: "UBL" | "JAZZCASH";
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  instructions: string;
}

export const MANUAL_PAYMENT_ACCOUNTS: ManualPaymentAccount[] = [
  {
    id: "UBL",
    bankName: "UBL (United Bank Limited)",
    accountTitle: "Amjad Ullah",
    accountNumber: "1095341691992",
    instructions:
      "Transfer the exact order amount via IBFT / Raast / UBL Digital and upload the transaction screenshot below.",
  },
  {
    id: "JAZZCASH",
    bankName: "JazzCash",
    accountTitle: "Shafi Ullah",
    accountNumber: "03069534618",
    instructions:
      "Send the exact order amount to this JazzCash mobile account and upload the confirmation screenshot below.",
  },
];
