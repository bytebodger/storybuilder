export interface SkillArg {
  name: string
  label: string
  placeholder?: string
  multiline?: boolean
  required?: boolean
}

export interface Skill {
  name: string
  description: string
  args: SkillArg[]
  /** Whether invoking it can modify canon. */
  writes: boolean
}

export interface RunRequest {
  universe: string
  skill: string
  args: Record<string, string>
}
