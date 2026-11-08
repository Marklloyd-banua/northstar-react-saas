import type { ReactNode } from 'react'
import { Modal } from './Modal'
export function FormModal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){return <Modal title={title} onClose={onClose}>{children}</Modal>}
