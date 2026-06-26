import { redirect } from 'next/navigation';

export default function CreateFounderRedirect() {
  redirect('/claim-role');
}
