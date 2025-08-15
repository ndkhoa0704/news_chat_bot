export function maskEmail(email) {
    const [name, domain] = email.split('@')
    if (!domain) return email
    const visible = name.slice(0, 2)
    return `${visible}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`
}