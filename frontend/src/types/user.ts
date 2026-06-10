export type User = {
  id:           string | number
  username:     string
  bio:          string
  email:        string
  avatarUrl:    string
}

export type UserResponse = {
  success: boolean
  data:    User
}