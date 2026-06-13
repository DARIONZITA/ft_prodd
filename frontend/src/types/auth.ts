import type { User } from "./user"

export type SignInForm = {
  identifier:   string
  password:     string
}

export type SignUpForm = {
  email:    string
  username: string
  password: string
  repeat:   string
}

export type AuthResponseData = {
  token:  string
  user:   User
}
