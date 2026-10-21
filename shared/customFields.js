/**
 * Custom invoice fields affect presentation only (preview, print, email).
 * They never change subtotal, discount, tax, or grand total (TC-CF-07).
 * Hiding a field sets visible=false; the saved value is kept (TC-CF-03).
 */

export function normalizeCustomFields(fields = []) {
  if (!Array.isArray(fields)) {
    return [];
  }

  return fields.map((field, index) => ({
    id: field?.id || `custom-${index}`,
    label: typeof field?.label === 'string' ? field.label : '',
    value: typeof field?.value === 'string' ? field.value : String(field?.value ?? ''),
    visible: field?.visible !== false,
  }));
}

export function getVisibleCustomFields(fields = []) {
  return normalizeCustomFields(fields).filter((field) => field.visible && field.label.trim());
}

export function createCustomField(overrides = {}) {
  return {
    id: overrides.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: overrides.label ?? '',
    value: overrides.value ?? '',
    visible: overrides.visible !== false,
  };
}
