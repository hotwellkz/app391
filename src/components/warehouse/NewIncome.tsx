@@ .. @@
                   <div className="text-lg sm:text-2xl font-bold text-gray-900">{totals.quantity}</div>
                   <div className="text-xs text-gray-500">Кол-во</div>
                 </div>
                 <div>
-                  <div className="text-lg sm:text-2xl font-bold text-gray-900">{totals.amount.toLocaleString()}</div>
+                  <div className="text-lg sm:text-2xl font-bold text-gray-900">{Math.round(totals.amount).toLocaleString()}</div>
                   <div className="text-xs text-gray-500">Сумма</div>
                 </div>
                 <div>
-                  <div className="text-lg sm:text-2xl font-bold text-emerald-600">{totals.total.toLocaleString()}</div>
+                  <div className="text-lg sm:text-2xl font-bold text-emerald-600">{Math.round(totals.total).toLocaleString()}</div>
                   <div className="text-xs text-gray-500">Итого</div>
                 </div>