import axios from 'axios'
import { env } from '@/http/env'

export const PROTHEUS_FINANCE_URL = axios.create({
  baseURL: env.API_PROTHEUS_FINANCE_URL,
})

export const PROTHEUS_DATA_URL = axios.create({
  baseURL: env.API_PROTHEUS_DATA_URL,
})
