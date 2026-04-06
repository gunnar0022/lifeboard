import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import BillsTracker from '../LifeManager/BillsTracker';
import TaskBoard from '../LifeManager/TaskBoard';
import ShoppingList from '../LifeManager/ShoppingList';
import './Organizer.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function OrganizerTasksBills() {
  const { data: tasks, refetch: refetchTasks } = useApi('/api/life/tasks?limit=50', { panelKey: 'life_manager' });
  const { data: bills, refetch: refetchBills } = useApi('/api/life/bills', { panelKey: 'life_manager' });
  const { data: shopping, refetch: refetchShopping } = useApi('/api/life/shopping', { panelKey: 'shopping' });
  const { data: config } = useApi('/api/config');

  const refetchAll = useCallback(() => {
    refetchTasks();
    refetchBills();
    refetchShopping();
  }, [refetchTasks, refetchBills, refetchShopping]);

  const currencySymbol = config?.currency_symbol || '$';

  return (
    <motion.div
      className="organizer-tab"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
    >
      <motion.div variants={fadeUp} className="organizer-tab__grid">
        <BillsTracker
          bills={bills || []}
          currencySymbol={currencySymbol}
          onRefresh={refetchAll}
        />
        <TaskBoard
          tasks={tasks || []}
          onRefresh={refetchAll}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <ShoppingList items={shopping || []} onRefresh={refetchShopping} />
      </motion.div>
    </motion.div>
  );
}
