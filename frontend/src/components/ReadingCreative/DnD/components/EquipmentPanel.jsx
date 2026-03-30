export default function EquipmentPanel({ equipment, coins, editMode, onUpdate }) {
  const coinTypes = ['CP', 'SP', 'EP', 'GP', 'PP'];

  const handleItemChange = (index, value) => {
    const updated = equipment.map((item, i) => i === index ? value : item);
    onUpdate({ equipment: updated });
  };

  const addItem = () => {
    onUpdate({ equipment: [...equipment, ''] });
  };

  const removeItem = (index) => {
    onUpdate({ equipment: equipment.filter((_, i) => i !== index) });
  };

  const adjustCoin = (type, delta) => {
    const current = coins[type] || 0;
    onUpdate({ coins: { ...coins, [type]: Math.max(0, current + delta) } });
  };

  return (
    <div className="dnd-equipment">
      <h3 className="dnd-section-title">Equipment</h3>
      <div className="dnd-equipment__list">
        {equipment.map((item, i) => (
          <div key={i} className="dnd-equipment__item">
            {editMode ? (
              <>
                <input className="dnd-field" value={item}
                  onChange={e => handleItemChange(i, e.target.value)} placeholder="Item name" />
                <button className="dnd-equipment__remove" onClick={() => removeItem(i)}>X</button>
              </>
            ) : (
              <span>{item}</span>
            )}
          </div>
        ))}
      </div>
      {editMode && (
        <button className="dnd-add-btn" onClick={addItem}>+ Add Item</button>
      )}

      <h3 className="dnd-section-title" style={{ marginTop: '1rem' }}>Coins</h3>
      <div className="dnd-coins">
        {coinTypes.map(type => (
          <div key={type} className="dnd-coins__cell">
            <span className="dnd-coins__label">{type}</span>
            <div className="dnd-coins__value">
              <button onClick={() => adjustCoin(type, -1)}>-</button>
              <span>{coins[type] || 0}</span>
              <button onClick={() => adjustCoin(type, 1)}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
