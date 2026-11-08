import { useEffect, useRef, type ReactNode } from 'react'

function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  const nodes = Array.from(container.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'))
  return nodes.filter((node) => !node.hasAttribute('disabled') && node.getAttribute('aria-hidden') !== 'true')
}

export function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){
 const dialogRef=useRef<HTMLElement>(null)
 const onCloseRef=useRef(onClose)
 onCloseRef.current=onClose
 useEffect(()=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null
  const previousOverflow=document.body.style.overflow
  document.body.style.overflow='hidden'
  const dialog=dialogRef.current
  const focusable=getFocusable(dialog)
  ;(focusable[0]??dialog)?.focus()
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onCloseRef.current();return}
   if(event.key!=='Tab') return
   const dialogNode=dialogRef.current
   if(!dialogNode) return
   const items=getFocusable(dialogNode)
   if(!items.length){event.preventDefault();dialogNode.focus();return}
   const first=items[0]
   const last=items[items.length-1]
   const active=document.activeElement
   if(!(active instanceof Node) || !dialogNode.contains(active) || !items.includes(active as HTMLElement)){
    event.preventDefault(); (event.shiftKey?last:first).focus(); return
   }
   if(event.shiftKey && active===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey && active===last){event.preventDefault();first.focus()}
  }
  document.addEventListener('keydown',onKeyDown)
  return ()=>{document.removeEventListener('keydown',onKeyDown);document.body.style.overflow=previousOverflow;previous?.focus?.()}
 },[])
 return <div className="modal-scrim" role="presentation" onMouseDown={event=>event.target===event.currentTarget&&onClose()}><section ref={dialogRef} tabIndex={-1} className={`app-modal ${wide?'modal-wide':''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><h2 id="modal-title">{title}</h2><button type="button" className="btn-icon" onClick={onClose} aria-label="Close dialog"><i className="bi bi-x-lg"/></button></div>{children}</section></div>
}
