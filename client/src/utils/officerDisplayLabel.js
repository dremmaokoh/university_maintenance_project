export function officerDisplayLabel(officer) {
  if (!officer?.fullName) {
    return '';
  }
  if (officer.jobTitle) {
    return `${officer.fullName} — ${officer.jobTitle}`;
  }
  return officer.fullName;
}
