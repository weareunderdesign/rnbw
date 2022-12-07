import React, { useEffect } from 'react';

import { Command } from 'cmdk';

import './style.css';

import { CmdKItemProps, CmdKProps, CmdKGroupProps, isGroup } from './types';



const Item = (props: CmdKItemProps) => {
  const { shortcut, title, onSelect } = props
  return (
    <Command.Item className="padding-m gap-s justify-stretch" onSelect={onSelect}>
      <div className="gap-s align-center">
        <div className="icon-folder icon-xs"></div>
        <span className="text-m">{title}</span>
      </div>
      <div className="gap-s">
        {shortcut && shortcut.split(' ').map((key, index) => {
          return <span className="text-m" key={'span_' + index}>{key}</span>
        })}
      </div>
    </Command.Item>
  )
}

const getGroup = (group: CmdKGroupProps, key: number) => {
  return (
    <Command.Group key={key} heading={group.heading} className="direction-row align-stretch background-primary">
      {
        group.items.map((_item, index) => {
          return <Item key={index} {..._item}></Item>
        })
      }
    </Command.Group>
  );
}
export default function CmdK(props: CmdKProps) {
  const { open, setOpen, onKeyDownCallback, items } = props
  const [search, setSearch] = React.useState('')

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    document.addEventListener('keydown', onKeyDownCallback)
    return () => document.removeEventListener('keydown', onKeyDownCallback)
  }, [onKeyDownCallback])


  return (
    <>
      <Command.Dialog open={open} onOpenChange={setOpen} label="Global Command Menu" className='box direction-row align-center radius-s background-primary shadow' >
        <Command.Input className="align-center" value={search} onValueChange={setSearch} />
        <Command.List className="box box-l">
          <Command.Empty>No results found.</Command.Empty>
          {
            items.map((item, index) => {
              if (isGroup(item)) {
                return getGroup(item as CmdKGroupProps, index)
              } else {
                return <Item {...(item as CmdKItemProps)}></Item>
              }
            })
          }
        </Command.List>
      </Command.Dialog>
    </>
  )
}