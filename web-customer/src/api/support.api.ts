import client from './client';
export type SupportTicket={id:number;ticketNumber:string;subject:string;status:string;lastMessageAt:string;unreadCount:number;messages?:any[]};
export async function listSupportTickets(){const{data}=await client.get<SupportTicket[]>('/support/tickets');return data}
export async function getSupportTicket(id:number){const{data}=await client.get<SupportTicket>(`/support/tickets/${id}`);return data}
export async function createSupportTicket(v:{subject:string;message:string;category:string;file?:File}){const f=new FormData();f.append('subject',v.subject);f.append('message',v.message);f.append('category',v.category);if(v.file)f.append('file',v.file);const{data}=await client.post<SupportTicket>('/support/tickets',f);return data}
export async function sendSupportMessage(id:number,message:string,file?:File){const f=new FormData();f.append('message',message);if(file)f.append('file',file);const{data}=await client.post<SupportTicket>(`/support/tickets/${id}/messages`,f);return data}
