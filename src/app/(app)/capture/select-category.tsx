import { DraftCategoryScreen } from '@/features/capture/components/draft-category-screen';

// Inside the capture modal: a native modal hides screens pushed on the stack
// below it, so the flow has its own picker instead of /select-category.
export default function CaptureSelectCategory() {
  return <DraftCategoryScreen mode="app" />;
}
