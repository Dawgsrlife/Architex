import { Sidebar } from '@/components/workflow/Sidebar';
import dynamic from 'next/dynamic';

import Editor from '@/components/workflow/Editor';
// const Editor = dynamic(() => import('@/components/workflow/Editor').then((mod) => mod.default), {
//   ssr: false,
// });

export default function WorkflowPage() {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 h-full relative">
        <Editor />
        {/* <div className="flex items-center justify-center h-full text-muted-foreground">Editor Loading...</div> */}
      </div>
    </div>
  );
}
