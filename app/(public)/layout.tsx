import ChatWidget from '@/components/shared/ChatWidget'
import Footer from '@/components/shared/Footer'
import Navbar from '@/components/shared/Navbar'
import React from 'react'

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <Navbar />
            {children}
            <Footer />
            <ChatWidget />
        </>
    )
}

export default layout