export interface SkillArg {
  name: string
  label: string
  placeholder?: string
  multiline?: boolean
  required?: boolean
}

export interface Skill {
  /** The identifier: how it is invoked, and what `/api/run` validates against. */
  name: string
  /** What a person should see instead of the name. Optional. */
  title?: string
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
