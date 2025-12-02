/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Group {
id: string
name: string
description: string | null
created_by: string | null
created_at: string
}


interface MessageRead {
  id: string
  message_id: string
  user_id: string
  group_id: string
  read_at: string
  created_at: string
}

interface Message {
  id: string
  group_id: string
  author_id: string | null
  body: string
  metadata: any
  created_at: string
  reads?: MessageRead[] // Add reads array
  read_by_user_ids?: string[] // For quick lookup
}



export interface Database {
public: {
Tables: {
groups: { Row: Group }
messages: { Row: Message }
}
}
}