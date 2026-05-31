export type User = {
  id:           string
  username:     string
  bio:          string
  email:        string
  avatarUrl:    string
}

export type UserResponse = {
  success: boolean
  data:    User
}