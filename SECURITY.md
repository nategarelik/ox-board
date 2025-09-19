# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.8.x   | :white_check_mark: |
| < 0.8   | :x:                |

## Reporting a Vulnerability

We take the security of OX Board seriously. If you have discovered a security vulnerability, please follow these steps:

1. **DO NOT** create a public GitHub issue for the vulnerability.
2. Send a detailed report to the maintainers via GitHub Security Advisory or private message.
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-3 days
  - High: 1 week
  - Medium: 2 weeks
  - Low: Next release cycle

## Security Considerations

### Camera Permissions
- OX Board requires camera access for hand gesture recognition
- Camera data is processed locally in the browser
- No video data is transmitted to external servers
- Users are prompted for permission before camera access

### Data Privacy
- All audio processing happens locally in the browser
- No personal data is collected or transmitted
- Settings are stored locally in browser storage
- No analytics or tracking is implemented

### Browser Security
- Always use HTTPS in production
- Keep dependencies updated
- Regular security audits of third-party libraries

## Best Practices for Users

1. Use OX Board only on trusted networks
2. Keep your browser updated
3. Grant camera permissions only on HTTPS sites
4. Review permissions regularly in browser settings

## Disclosure Policy

When we receive a security report, we will:
1. Confirm the vulnerability
2. Determine affected versions
3. Develop and test a fix
4. Release the patch
5. Publicly disclose the vulnerability (after fix is available)

## Security Updates

Security updates will be released as patch versions and announced via:
- GitHub Security Advisories
- Release notes
- README updates

Thank you for helping keep OX Board and our users safe!