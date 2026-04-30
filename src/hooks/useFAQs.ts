import { useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: string;
    order_index: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface FAQCategory {
    id: string;
    name: string;
    icon: string;
    order_index: number;
}

const defaultFAQs: FAQItem[] = [
    {
        id: '1',
        question: 'Can I use Tirzepatide?',
        answer: 'Before purchasing, please check if Tirzepatide is suitable for you.\n✔️ View the checklist here — Contact us for more details.',
        category: 'PRODUCT & USAGE',
        order_index: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '2',
        question: 'Do you reconstitute (recon) Tirzepatide?',
        answer: 'Yes — for Metro Manila orders only.\nI provide free reconstitution when you purchase the complete set.\nI use pharma-grade bacteriostatic water, and I ship it with an ice pack + insulated pouch to maintain stability.',
        category: 'PRODUCT & USAGE',
        order_index: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '3',
        question: 'What size needles and cartridges do you offer?',
        answer: '• Needles: Compatible with all insulin-style pens (standard pen needle sizes).\n• Cartridges: Standard 3mL capacity.',
        category: 'PRODUCT & USAGE',
        order_index: 3,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '4',
        question: 'Can the pen pusher be retracted?',
        answer: '• Reusable pens: Yes, the pusher can be retracted.\n• Disposable pens: The pusher cannot be retracted and will stay forward once pushed.',
        category: 'PRODUCT & USAGE',
        order_index: 4,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '5',
        question: 'How should peptides be stored?',
        answer: 'Peptides must be stored in the refrigerator, especially once reconstituted.',
        category: 'PRODUCT & USAGE',
        order_index: 5,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '6',
        question: "What's included in my order?",
        answer: 'Depending on your chosen items:\n• 3mL cartridge\n• Pen needles\n• Optional: alcohol swabs\n• Free Tirzepatide reconstitution for Metro Manila set orders',
        category: 'ORDERING & PACKAGING',
        order_index: 6,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '7',
        question: 'Do you offer bundles or discounts?',
        answer: 'Yes — I offer curated bundles and custom sets.\nMessage me for personalized bundle options.',
        category: 'ORDERING & PACKAGING',
        order_index: 7,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '8',
        question: 'Can I return items?',
        answer: '• Pens: Returnable within 1 week if defective.\n• Needles and syringes: Not returnable for hygiene and safety.',
        category: 'ORDERING & PACKAGING',
        order_index: 8,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '9',
        question: 'What payment options do you accept?',
        answer: '• GCash\n• Security Bank\n• BDO\n\n❌ COD is not accepted, except for Lalamove\n→ You can pay the rider directly or have the rider pay upfront on your behalf.',
        category: 'PAYMENT METHODS',
        order_index: 9,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '10',
        question: 'Where are you located?',
        answer: '📍 Merville, Parañaque City',
        category: 'SHIPPING & DELIVERY',
        order_index: 10,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '11',
        question: 'How long is shipping?',
        answer: '📦 J&T Express: Usually 2–3 days\n(Transit time may vary by location and sorting)',
        category: 'SHIPPING & DELIVERY',
        order_index: 11,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '12',
        question: 'When do orders ship out?',
        answer: 'Orders placed before 11:00 AM ship out on the next J&T schedule (Tuesday & Thursday)\n→ Subject to order volume.',
        category: 'SHIPPING & DELIVERY',
        order_index: 12,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '13',
        question: 'Do you ship nationwide?',
        answer: 'Yes —\n• J&T Express (nationwide)\n• Lalamove (Metro Manila & nearby areas)',
        category: 'SHIPPING & DELIVERY',
        order_index: 13,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

export const useFAQs = () => {
    const data = useQuery(api.faqs.listActive);
    const loading = data === undefined;

    const faqs = useMemo<FAQItem[]>(() => {
        if (!data || data.length === 0) return defaultFAQs;
        return data as FAQItem[];
    }, [data]);

    const categories = [...new Set(faqs.map((faq) => faq.category))];

    return { faqs, categories, loading, error: null, refetch: () => Promise.resolve() };
};

export const useFAQsAdmin = () => {
    const data = useQuery(api.faqs.listAll);
    const createMutation = useMutation(api.faqs.create);
    const updateMutation = useMutation(api.faqs.update);
    const removeMutation = useMutation(api.faqs.remove);

    const faqs = useMemo(() => (data ?? []) as FAQItem[], [data]);
    const loading = data === undefined;

    const addFAQ = async (faq: Omit<FAQItem, 'id' | 'created_at' | 'updated_at'>) => {
        return createMutation({
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            order_index: faq.order_index,
            is_active: faq.is_active,
        });
    };

    const updateFAQ = async (id: string, updates: Partial<FAQItem>) => {
        return updateMutation({
            id,
            question: updates.question,
            answer: updates.answer,
            category: updates.category,
            order_index: updates.order_index,
            is_active: updates.is_active,
        });
    };

    const deleteFAQ = async (id: string) => {
        await removeMutation({ id });
    };

    return { faqs, loading, error: null, addFAQ, updateFAQ, deleteFAQ, refetch: () => Promise.resolve() };
};
