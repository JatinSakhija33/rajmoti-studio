import test from "node:test";
import assert from "node:assert/strict";
import { sessionFromDocument, workflowSummary, normalizePhone } from "../src/lib/rajmoti-os-firestore-contract.mjs";

const job = {
  id: 1001, userId: "rajmoti_studio", familyId: 77,
  billNumber: "#RM1", stage: "Printing",
  itemDescription: "20x30 glass frame",
  totalBill: 2150, advancePaid: 1500, balanceDue: 650,
  createdDate: 1795000000000, dueDate: null,
};

test("normalizes Indian contact numbers", () => {
  assert.equal(normalizePhone("+91 82004 73382"), "8200473382");
});
test("rejects blank bill numbers and wrong tenants", () => {
  assert.equal(sessionFromDocument("x", {...job, billNumber: ""}), null);
  assert.equal(sessionFromDocument("x", {...job, userId: "other"}), null);
});
test("does not infer unknown due dates", () => {
  const result = sessionFromDocument("#RM1", job);
  assert.equal(result.dueDateMs, null);
  assert.equal(result.balanceDue, 650);
});
test("joins families by numeric ID without inventing overdue tasks", () => {
  const result = workflowSummary(
    [{id:"#RM1",data:job}],
    [{id:"8200473382",data:{id:77,userId:"rajmoti_studio",name:"Jekinbhai",mobile:"8200473382"}}],
    Date.UTC(2026,10,28)
  );
  assert.equal(result.activeCount, 1);
  assert.equal(result.overdueCount, 0);
  assert.equal(result.missingContactCount, 0);
  assert.equal(result.jobs[0].customer.name, "Jekinbhai");
});
test("interprets due-today boundaries in Asia/Kolkata", () => {
  const result = workflowSummary(
    [{id:"#RM1",data:{...job,dueDate:Date.UTC(2026,10,27,19,0)}}],
    [],
    Date.UTC(2026,10,28,6)
  );
  assert.equal(result.dueTodayCount, 1);
});
