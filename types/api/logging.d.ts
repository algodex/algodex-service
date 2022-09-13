type Severity = 'Error' | 'Info' | 'Debug'

interface LogMessage {
  message: string,
  severity: Severity,
  unixTime: number
}