import { describe, expect, it } from "vitest";

/** Operational copy that must remain visible in table bill UI. */
export const TABLE_BILL_DISCLAIMERS = {
  operational:
    "Esta conta é apenas um resumo operacional dos pedidos da sessão.",
  noPayment: "Não processa pagamento.",
  noInvoice: "Não emite fatura.",
  externalPayment:
    "O pagamento e a fatura devem ser tratados fora do sistema, pelo método habitual do restaurante.",
  printNote: "Impressão simples para apoio operacional. Não é documento fiscal.",
  closeSession:
    "Fechar sessão não marca pagamento nem emite fatura. Use apenas quando a conta já foi tratada fora do sistema.",
};

describe("table bill disclaimer copy", () => {
  it("states operational summary only", () => {
    expect(TABLE_BILL_DISCLAIMERS.operational).toContain("resumo operacional");
    expect(TABLE_BILL_DISCLAIMERS.noPayment).toContain("pagamento");
    expect(TABLE_BILL_DISCLAIMERS.noInvoice).toContain("fatura");
  });

  it("print label is operational not fiscal", () => {
    expect(TABLE_BILL_DISCLAIMERS.printNote).toContain("Não é documento fiscal");
  });
});
