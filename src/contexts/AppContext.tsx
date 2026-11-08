import { createContext,useCallback,useContext,useMemo,useState,type ReactNode } from 'react'
type Toast={id:number;message:string;kind:'success'|'error'|'info'}
type AppContextValue={dark:boolean;toggleTheme:()=>void;sidebarOpen:boolean;toggleSidebar:()=>void;toast:(message:string,kind?:Toast['kind'])=>void;toasts:Toast[];dismiss:(id:number)=>void}
const AppContext=createContext<AppContextValue|null>(null)
export function AppProvider({children}:{children:ReactNode}){const[dark,setDark]=useState(()=>localStorage.getItem('saas-admin-theme')==='dark');const[sidebarOpen,setSidebarOpen]=useState(false);const[toasts,setToasts]=useState<Toast[]>([])
 const toast=useCallback((message:string,kind:Toast['kind']='success')=>{const id=Date.now();setToasts(items=>[...items,{id,message,kind}]);window.setTimeout(()=>setToasts(items=>items.filter(item=>item.id!==id)),3600)},[])
 const value=useMemo<AppContextValue>(()=>({dark,toggleTheme:()=>setDark(value=>{localStorage.setItem('saas-admin-theme',value?'light':'dark');return !value}),sidebarOpen,toggleSidebar:()=>setSidebarOpen(value=>!value),toast,toasts,dismiss:id=>setToasts(items=>items.filter(item=>item.id!==id))}),[dark,sidebarOpen,toasts,toast])
 return <AppContext.Provider value={value}><div data-theme={dark?'dark':'light'} className="app-theme">{children}</div></AppContext.Provider>}
export function useApp(){const context=useContext(AppContext);if(!context)throw new Error('useApp must be inside AppProvider');return context}
