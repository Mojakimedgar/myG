import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
export default function About() {
    const [open, setOpen] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => setOpen(true), children: "About" }), _jsx(Dialog, { open: open, onOpenChange: setOpen, children: _jsx(DialogContent, { children: _jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "About MyG" }), _jsx(DialogDescription, { children: "MyG is a family safety monitor application that helps you track your G's, monitor zones, and receive real-time activity notifications for enhanced safety and peace of mind." })] }) }) })] }));
}
