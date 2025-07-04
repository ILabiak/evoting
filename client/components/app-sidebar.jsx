"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar";
import {
    IconArrowLeft,
    IconBrandTabler,
    IconSettings,
    IconUserBolt,
} from "@tabler/icons-react";
import { User } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/app/context/AuthContext';

export default function AppSidebar({ children }) {
    const { user } = useAuth();
    const links = [
        {
            label: "Dashboard",
            href: "/dashboard",
            icon: (
                <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
            ),
        },
        {
            label: "Profile",
            href: "/profile",
            icon: (
                <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
            ),
        },
        {
            label: "Settings",
            href: "/settings",
            icon: (
                <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
            ),
        },
        {
            label: "Logout",
            href: "/logout",
            icon: (
                <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
            ),
        },
    ];
    const [open, setOpen] = useState(false);
    return (
        <div
            className={cn(
                "mx-auto flex w-full max-w flex-1 flex-col overflow-hidden border border-sidebar-border bg-sidebar-primary md:flex-row dark:border-neutral-700",
                "h-screen"
            )}>
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
                        {open ? (
                            <div className="flex flex-row justify-between pr-10 md:pr-0">
                                <Logo />
                                <ThemeToggle />
                            </div>
                        ) : <LogoIcon />}
                        <div className="mt-8 flex flex-col gap-2">
                            {links.map((link, idx) => (
                                <SidebarLink key={idx} link={link} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <SidebarLink
                            link={{
                                label: `${user?.name}`,
                                href: "/profile",
                                icon: (
                                    <User size={32} className="shrink-0 text-black dark:text-white" />
                                ),
                            }} />
                    </div>
                </SidebarBody>
            </Sidebar>
            {children}
        </div>
    );
}
export const Logo = () => {
    return (
        <a
            href="/"
            className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black">
            <div
                className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-medium whitespace-pre text-black dark:text-white">
                ChainVote
            </motion.span>
        </a>
    );
};
export const LogoIcon = () => {
    return (
        <a
            href="/"
            className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black">
            <div
                className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
        </a>
    );
};

// Dummy dashboard component with content
const Dashboard = () => {
    return (
        <div className="flex flex-1 flex-col">
            <div
                className="flex h-full w-full flex-1 flex-col gap-2  border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-950">
                <div className="flex gap-2">
                    {[...new Array(4)].map((i, idx) => (
                        <div
                            key={"first-array-demo-1" + idx}
                            className="h-20 w-full rounded-lg bg-gray-100 dark:bg-neutral-800"></div>
                    ))}
                </div>
                <div className="flex flex-1 gap-2">
                    {[...new Array(2)].map((i, idx) => (
                        <div
                            key={"second-array-demo-1" + idx}
                            className="h-full w-full rounded-lg bg-gray-100 dark:bg-neutral-800"></div>
                        //animate-pulse
                    ))}
                </div>
            </div>
        </div>
    );
};
