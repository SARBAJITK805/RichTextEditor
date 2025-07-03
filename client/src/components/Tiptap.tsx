'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import MenuBar from './MenuBar'
import axios from "axios";
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { useEffect, useState } from 'react'
import TitleBar from './TitleBar'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { SocketIOProvider } from 'y-socket.io'
import { useSession } from 'next-auth/react';


const Tiptap = () => {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [permission, setPermission] = useState<"OWNER" | "EDITOR" | "VIEWER">("OWNER")
  const [hasInitialized, setHasInitialized] = useState(true)
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null)
  const [provider, setProvider] = useState<SocketIOProvider | null>(null)
  const [isCollaborating, setIsCollaborating] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  console.log(content)

  const session = useSession()

  async function saveCollaborativeDocument() {
    if (!editor || !isCollaborating) {
      return
    }
    try {
      const resp = await axios.post('/api/docs/save', {
        title,
        content: editor.getHTML(),
        permission
      }, {
        withCredentials: true
      })
      if (resp.status == 200) {
        console.log('Document auto-saved during collaboration')
      }
    } catch (error) {
      console.error('Failed to auto-save during collaboration:', error)
    }
  }

  function startCollaboration(doc_id: string) {
    const doc = new Y.Doc()
    const socketProvider = new SocketIOProvider(
      'http://localhost:8080',
      doc_id,
      doc,
      {
        autoConnect: true,
      },
      {
        query: {
          doc_id,
          email:session.data?.user?.email
        }
      },
    )
    socketProvider.on('status', (event: any) => {
      setConnectionStatus(event.status)
    })

    socketProvider.on('connection-error', (error: any) => {
      console.error('Collaboration connection error:', error)
      setConnectionStatus('disconnected')
    })

    socketProvider.on('connect', () => {
      console.log('Connected to collaboration server')
      setConnectionStatus('connected')
    })

    socketProvider.on('disconnect', () => {
      console.log('Disconnected from collaboration server')
      setConnectionStatus('disconnected')
    })

    setYdoc(doc)
    setProvider(socketProvider)
    setIsCollaborating(true)
    setConnectionStatus('connecting')
  }

  async function stopCollaboration() {
    if (editor && isCollaborating) {
      await saveCollaborativeDocument()
    }
    if (provider) {
      provider.destroy()
    }
    if (ydoc) {
      ydoc.destroy()
    }
    setYdoc(null)
    setProvider(null)
    setIsCollaborating(false)
    setConnectionStatus('disconnected')

    if (editor && content) {
      editor.commands.setContent(content)
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: !isCollaborating,
        bulletList: {
          HTMLAttributes: {
            class: "list-disc ml-6 my-2",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal ml-6 my-2",
          },
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight,
      ...(isCollaborating && ydoc ? [
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCursor.configure({
          provider: provider,
          user: {
            name: 'User',
            color: '#f783ac',
          },
        }),
      ] : []),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none min-h-[600px] p-8 focus:outline-none bg-white rounded-lg border border-gray-200 shadow-sm",
      },
    },
    onUpdate: ({ editor }) => {
      if (!isCollaborating) {
        setContent(editor.getHTML())
      }
    },
  })

  useEffect(() => {
    if (editor && content && !hasInitialized) {
      editor.commands.setContent(content)
      setHasInitialized(true)
    }
  }, [editor, content])

  useEffect(() => {
    setHasInitialized(false)
    if (editor) {
      editor.commands.setContent(content)
    }
  }, [title])

  useEffect(() => {
    editor?.setEditable(permission !== "VIEWER")
  }, [editor, permission])

  useEffect(() => {
    setInterval(() => {
      saveCollaborativeDocument()
    }, 1000)
  }, [editor, isCollaborating, title])

  useEffect(() => {
    return () => {
      stopCollaboration()
    }
  }, [])

  useEffect(() => {
    if (!ydoc || !isCollaborating) return
    const updateHandler = () => {
      if (editor) {
        const currentContent = editor.getHTML()
        setContent(currentContent)
      }
    }
    ydoc.on('update', updateHandler)

    return () => {
      ydoc.off('update', updateHandler)
    }
  }, [ydoc, editor, isCollaborating])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="py-4">
          <TitleBar
            permission={permission}
            setPermission={setPermission}
            title={title}
            setTitle={setTitle}
            content={content}
            setContent={setContent}
            onStartCollaboration={startCollaboration}
            onStopCollaboration={stopCollaboration}
            isCollaborating={isCollaborating}
            connectionStatus={connectionStatus}
          />
        </div>

        <div className="border-b border-gray-200 px-6 py-3">
          <MenuBar editor={editor} />
          <div className="p-6">
            <div className="rounded-lg border border-gray-200 shadow-sm">
              <EditorContent
                editor={editor}
                className="min-h-[70vh] focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-20 rounded-lg transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Tiptap