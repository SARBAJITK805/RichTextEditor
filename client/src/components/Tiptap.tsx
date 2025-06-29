'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import MenuBar from './MenuBar'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { useEffect, useState } from 'react'
import TitleBar from './TitleBar'

const Tiptap = () => {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  console.log(content)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
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
    ],
    content: content,
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none min-h-[600px] p-8 focus:outline-none bg-white rounded-lg border border-gray-200 shadow-sm",
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="py-4">
          <TitleBar title={title} setTitle={setTitle} content={content} />
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