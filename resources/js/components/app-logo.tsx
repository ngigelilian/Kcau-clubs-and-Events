export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                <span className="text-xs font-black leading-none tracking-tighter">KC</span>
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-sidebar-foreground">KCAU Campus</span>
                <span className="truncate text-[10px] text-sidebar-foreground/60 font-medium">Clubs & Events</span>
            </div>
        </>
    );
}
