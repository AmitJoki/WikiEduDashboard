# frozen_string_literal: true

class HeardFromAlertManager
  def create_alert(user_name, msg)
    user =  User.find_by_username(user_name)
    if !Alert.exists?(user_id: user.id, type: 'HeardFromAlert')
      alert = Alert.create(type: 'HeardFromAlert',
                           user: User
                           message: msg,
                           target_user: SpecialUsers.outreach_manager)
      alert.email_target_user
    end
  end
end
