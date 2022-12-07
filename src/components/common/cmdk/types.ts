export type CmdKItemProps = {
    title: string,
    shortcut?: string
    onSelect?: (value: string) => void
}

export type CmdKGroupProps = {
    heading: string,
    items: CmdKItemProps[]
}

export type CmdKItemGeneralProps = CmdKItemProps | CmdKGroupProps

export type CmdKProps = {
    onKeyDownCallback: (e: KeyboardEvent) => void,
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>,
    items: CmdKItemGeneralProps[]
}

export const isGroup = (item: CmdKItemGeneralProps) => { return (item as CmdKGroupProps).items !== undefined }
