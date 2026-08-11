import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerSecrets } from "@/db/schema";
import { DEMO_CUSTOMER, DEMO_EDIT_VALUES } from "@/lib/demo-customer";
import { decryptProvisioningInput } from "@/lib/provisioning";

export type CustomerDisplayProfile = {
  phaseLabels: [string, string, string];
  hasAiContext: boolean;
};

const DEFAULT_PROFILE: CustomerDisplayProfile = {
  phaseLabels: ["Faza A", "Faza B", "Faza C"],
  hasAiContext: false,
};

export async function getCustomerDisplayProfile(customerId: string): Promise<CustomerDisplayProfile> {
  try {
    const values = customerId === DEMO_CUSTOMER.id
      ? DEMO_EDIT_VALUES
      : await loadEncryptedValues(customerId);
    if (!values) return DEFAULT_PROFILE;
    return {
      phaseLabels: [values.phaseALabel, values.phaseBLabel, values.phaseCLabel],
      hasAiContext: Boolean(
        values.businessType || values.workingHours || values.majorEquipment
        || values.alwaysOnEquipment || values.energyGoals || values.siteContext
      ),
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

async function loadEncryptedValues(customerId: string) {
  const [vault] = await getDb().select({ encryptedPayload: customerSecrets.encryptedPayload })
    .from(customerSecrets).where(eq(customerSecrets.customerId, customerId)).limit(1);
  return vault ? decryptProvisioningInput(vault.encryptedPayload) : null;
}
