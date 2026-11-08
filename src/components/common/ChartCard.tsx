import type { ReactNode } from 'react'
export function ChartCard({title,description,children}:{title:string;description:string;children:ReactNode}){return <section className="panel"><div className="panel-heading"><div><h2>{title}</h2><p>{description}</p></div></div>{children}</section>}
