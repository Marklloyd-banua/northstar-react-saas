import type { ApiError } from '../../types/models'
import { repositoryConfig } from '../repositoryConfig'
import { getApiAuthHeaders } from './interceptors'

/**
 * Shared HTTP client for API mode.
 * - Applies configurable base URL and timeout from `repositoryConfig` (canonical env config).
 * - Merges optional auth headers from `interceptors` (future backend integration point).
 * - Normalizes fetch/abort/JSON/HTTP errors into `ApiError`-shaped failures.
 * Do not place secrets in `VITE_*` variables; frontend config is public.
 * Future production auth should prefer HttpOnly cookie sessions when supported by the backend.
 */
export async function request<T>(path:string,init:RequestInit={}):Promise<T>{
 const baseUrl=repositoryConfig.apiBaseUrl
 const timeout=repositoryConfig.apiTimeoutMs
 const controller=new AbortController()
 const timer=window.setTimeout(()=>controller.abort(new DOMException('Request timed out','TimeoutError')),timeout)
 const abortFromCaller=()=>controller.abort(init.signal?.reason)
 if(init.signal?.aborted)abortFromCaller()
 else init.signal?.addEventListener('abort',abortFromCaller,{once:true})
 const url=`${baseUrl.replace(/\/$/,'')}/${path.replace(/^\//,'')}`
 try{
  const response=await fetch(url,{...init,signal:controller.signal,headers:{Accept:'application/json','Content-Type':'application/json',...getApiAuthHeaders(),...init.headers}})
  const body=response.status===204?'':await response.text()
  let payload:unknown
  if(body){try{payload=JSON.parse(body)}catch{payload=undefined}}
  if(!response.ok){
   const rawDetails=payload&&typeof payload==='object'&&'details'in payload?payload.details:undefined
   const details=rawDetails&&typeof rawDetails==='object'&&!Array.isArray(rawDetails)?Object.fromEntries(Object.entries(rawDetails).map(([key,value])=>[key,String(value)])):undefined
   const message=payload&&typeof payload==='object'&&'message'in payload&&typeof payload.message==='string'?payload.message:`Request failed (${response.status})`
   throw {message,code:String(response.status),...(details&&typeof details==='object'?{details}: {})} satisfies ApiError
  }
  if(!body)return undefined as T
  if(payload===undefined)throw {message:'The API returned invalid JSON.',code:'INVALID_RESPONSE'} satisfies ApiError
  return payload as T
 }catch(error){
  if(error&&typeof error==='object'&&'message'in error&&'code'in error)throw error
  if(controller.signal.aborted){const timedOut=controller.signal.reason instanceof DOMException&&controller.signal.reason.name==='TimeoutError';throw {message:timedOut?'The API request timed out. Please try again.':'The API request was cancelled.',code:timedOut?'TIMEOUT':'CANCELLED'} satisfies ApiError}
  throw {message:'Unable to reach the API. Check your connection and try again.'} satisfies ApiError
 }finally{
  window.clearTimeout(timer)
  init.signal?.removeEventListener('abort',abortFromCaller)
 }
}
