type Severity = 'Error' | 'Info' | 'Debug'

interface LogMessage {
  message: string,
  severity: Severity,
  unixTime: number,
  environment: string,
  href: string,
  unixTime: number,
  ipAddress: string
}