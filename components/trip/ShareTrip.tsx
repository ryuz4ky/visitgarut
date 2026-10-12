'use client'
import {useState} from 'react'
export default function ShareTrip(){const [message,setMessage]=useState('');return <div><button type="button" className="vg-button vg-secondary" onClick={async()=>{try{await navigator.clipboard.writeText(window.location.href);setMessage('Tautan rencana tersalin.')}catch{setMessage('Salin alamat halaman ini untuk membagikan rencana.')}}}>Salin tautan rencana</button><p role="status">{message}</p></div>}
