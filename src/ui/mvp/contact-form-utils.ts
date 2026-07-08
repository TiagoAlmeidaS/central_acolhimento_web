export type ContactFormState = {
  city: string;
  postalCode: string;
  openHouse: boolean;
  street: string;
  neighborhood: string;
  addressNumber: string;
  state: string;
};

export function normalizePostalCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatPostalCode(value: string) {
  const digits = normalizePostalCode(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function formatPhone(value: string) {
  const digits = normalizePhone(value);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function composeAddress(form: ContactFormState) {
  if (!form.openHouse) return "";

  const streetLine = [form.street.trim(), form.addressNumber.trim()].filter(Boolean).join(", ");
  const regionLine = [form.neighborhood.trim(), form.city.trim(), form.state.trim()].filter(Boolean).join(" · ");
  const postalCode = formatPostalCode(form.postalCode);

  return [streetLine, regionLine, postalCode ? `CEP ${postalCode}` : ""].filter(Boolean).join(" · ");
}
