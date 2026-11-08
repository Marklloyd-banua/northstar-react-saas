import { getSeedData } from '../../data/mockData'
import type { BaseRecord, PaginatedResponse } from '../../types/models'
const key=(resource:string)=>`saas-admin-demo:${resource}`
const wait=(ms=180)=>new Promise(resolve=>setTimeout(resolve,ms))

function createRecordId(resource: string): string {
  if (resource.startsWith('store-categories:') || resource.startsWith('store-products:') || resource.startsWith('store-stock-adjustments:') || resource.startsWith('store-orders:')) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  }
  return `${resource.slice(0,3).toUpperCase()}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`
}
function readRows(resource:string):BaseRecord[]{
 try{
  const stored=localStorage.getItem(key(resource))
  if(!stored)return getSeedData(resource)
  const parsed:unknown=JSON.parse(stored)
  if(Array.isArray(parsed)&&parsed.every((row)=>row&&typeof row==='object'&&typeof row.id==='string'&&typeof row.status==='string'&&typeof row.createdAt==='string'))return parsed as BaseRecord[]
 }catch{ /* Use the fixtures when browser storage is unavailable or invalid. */ }
 return getSeedData(resource)
}
export async function listRecords(resource:string, query='', status='All', page=1, pageSize=8, sortBy='', sortDirection:'asc'|'desc'='asc'):Promise<PaginatedResponse<BaseRecord>>{
 await wait()
 let rows=readRows(resource)
 if(query) rows=rows.filter(row=>Object.values(row).some(value=>String(value).toLowerCase().includes(query.toLowerCase())))
 if(status!=='All') rows=rows.filter(row=>row.status===status)
 if(sortBy) rows.sort((left,right)=>String(left[sortBy]??'').localeCompare(String(right[sortBy]??''),undefined,{numeric:true,sensitivity:'base'})*(sortDirection==='asc'?1:-1))
 return {items:rows.slice((page-1)*pageSize,page*pageSize),page,pageSize,total:rows.length}
}
export async function saveRecord(resource:string, value:Partial<BaseRecord>, id?:string):Promise<BaseRecord>{
 await wait(260); const rows=readRows(resource)
 const now=new Date().toISOString().slice(0,10)
 if(id){
  const existing=rows.find(row=>row.id===id)
  if(!existing)throw {message:'Record not found in demo data.',code:'NOT_FOUND'} satisfies {message:string;code:string}
  const record:BaseRecord={...existing,...value,id,createdAt:existing.createdAt,status:value.status??existing.status,updatedAt:now}
  const updated=rows.map(row=>row.id===id?record:row)
  localStorage.setItem(key(resource),JSON.stringify(updated)); return record
 }
 const createdId=createRecordId(resource)
 const record:BaseRecord={status:'Active',createdAt:now,updatedAt:now,...value,id:createdId} as BaseRecord
 const updated=[record,...rows]
 localStorage.setItem(key(resource),JSON.stringify(updated)); return record
}
export async function removeRecord(resource:string,id:string):Promise<void>{await wait();const rows=readRows(resource);localStorage.setItem(key(resource),JSON.stringify(rows.filter(row=>row.id!==id)))}
export async function updateStatus(resource:string,id:string,status:BaseRecord['status']):Promise<void>{await wait();const rows=readRows(resource);const now=new Date().toISOString().slice(0,10);localStorage.setItem(key(resource),JSON.stringify(rows.map(row=>row.id===id?{...row,status,updatedAt:now}:row)))}
